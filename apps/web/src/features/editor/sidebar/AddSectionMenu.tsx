import { Plus } from 'lucide-react';
import { SECTION_DEFINITIONS, SECTION_MENU_ORDER } from '@resumeforge/core';
import { Button } from '../../../components/ui/Button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../../../components/ui/Menu';
import { addSection } from '../../../state/editorActions';
import { useSidebarStore } from './sidebarStore';
import { SECTION_ICONS } from './sectionIcons';

export function AddSectionMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="secondary" size="sm" icon={<Plus className="size-4" />}>
          Add section
        </Button>
      </MenuTrigger>
      <MenuContent align="end" className="w-72">
        {SECTION_MENU_ORDER.map((type) => {
          const def = SECTION_DEFINITIONS[type];
          const Icon = SECTION_ICONS[def.icon];
          return (
            <MenuItem
              key={type}
              icon={<Icon className="size-4" />}
              onSelect={() => {
                const id = addSection(type);
                useSidebarStore.getState().reveal(id);
              }}
            >
              <span className="flex flex-col py-1">
                <span className="leading-tight">{def.label}</span>
                <span className="text-xs leading-tight text-muted">{def.description}</span>
              </span>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
