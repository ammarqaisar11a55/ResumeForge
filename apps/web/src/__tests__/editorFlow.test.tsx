import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { createResume, type Resume } from '@resumeforge/core';
import { TooltipProvider } from '../components/ui/Tooltip';
import EditorPage from '../pages/EditorPage';
import { resumeService } from '../services';
import { useEditorStore } from '../state/editorStore';

function renderEditor(resume: Resume) {
  resumeService.save(resume);
  const router = createMemoryRouter([{ path: '/app/resume/:id', element: <EditorPage /> }], {
    initialEntries: [`/app/resume/${resume.id}`],
  });
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  );
}

const preview = () => screen.getByRole('region', { name: 'Resume preview' });
const stored = (id: string) => JSON.parse(localStorage.getItem(`resumeforge:v1:resume:${id}`) ?? 'null') as Resume;

afterEach(() => {
  useEditorStore.getState().unload();
});

describe('editor flow', () => {
  it('edits personal information, updates the live preview and autosaves', async () => {
    const user = userEvent.setup();
    const resume = createResume({ title: 'Integration' });
    renderEditor(resume);

    const name = await screen.findByLabelText('Full name');
    expect(within(preview()).getByRole('heading', { level: 1 })).toHaveTextContent('Your Name');
    await user.type(name, 'Sam Lee');
    expect(within(preview()).getByRole('heading', { level: 1 })).toHaveTextContent('Sam Lee');

    await waitFor(() => expect(stored(resume.id).personalInfo.fullName).toBe('Sam Lee'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByTestId('save-status')).toHaveTextContent('Saved'));
  });

  it('adds a section from the menu and undoes it with the keyboard', async () => {
    const user = userEvent.setup();
    const resume = createResume({ fullName: 'Sam Lee' });
    renderEditor(resume);
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Add section' }));
    await user.click(await screen.findByRole('menuitem', { name: /Awards/ }));
    const sections = screen.getByTestId('sections-panel');
    expect(within(sections).getByRole('button', { name: /^Awards/ })).toBeInTheDocument();

    // A new section opens with one entry; fill it so it appears on the page.
    await user.type(await screen.findByLabelText('Award'), "Dean's Honour List");
    expect(within(preview()).getByText("Dean's Honour List")).toBeInTheDocument();
    expect(within(preview()).getByRole('heading', { level: 2, name: 'Awards' })).toBeInTheDocument();

    // Click somewhere neutral so the shortcut is not captured by the input.
    await user.click(document.body);
    await user.keyboard('{Control>}z{/Control}');
    await user.keyboard('{Control>}z{/Control}');
    await user.keyboard('{Control>}z{/Control}');
    await waitFor(() => expect(within(sections).queryByRole('button', { name: /^Awards/ })).not.toBeInTheDocument());
    expect(within(preview()).queryByText("Dean's Honour List")).not.toBeInTheDocument();

    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(within(sections).getByRole('button', { name: /^Awards/ })).toBeInTheDocument();
  });

  it('hides a section from the resume without deleting it', async () => {
    const user = userEvent.setup();
    const resume = createResume({ fullName: 'Sam Lee' });
    const summary = resume.sections[0]!;
    if (summary.type === 'summary') summary.entries[0]!.text = 'Engineer who ships.';
    renderEditor(resume);
    await screen.findByLabelText('Full name');

    expect(within(preview()).getByText('Engineer who ships.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hide Summary from resume' }));
    expect(within(preview()).queryByText('Engineer who ships.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Summary on resume' }));
    expect(within(preview()).getByText('Engineer who ships.')).toBeInTheDocument();
  });

  it('switches templates without losing content', async () => {
    const user = userEvent.setup();
    const resume = createResume({ fullName: 'Sam Lee' });
    renderEditor(resume);
    await screen.findByLabelText('Full name');

    const doc = () => preview().querySelector('.rf-document')!;
    expect(doc()).toHaveClass('rf-tpl-classic');
    await user.click(screen.getByRole('radio', { name: /Forge Modern/ }));
    expect(doc()).toHaveClass('rf-tpl-modern');
    expect(within(preview()).getByRole('heading', { level: 1 })).toHaveTextContent('Sam Lee');
  });

  it('shows a message for resumes that do not exist', async () => {
    const router = createMemoryRouter([{ path: '/app/resume/:id', element: <EditorPage /> }], {
      initialEntries: ['/app/resume/00000000-0000-4000-8000-00000000dead'],
    });
    render(
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Resume not found' })).toBeInTheDocument();
  });
});
