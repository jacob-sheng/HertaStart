import React, { useCallback, useMemo, useState } from 'react';
import { EditIcon, GripVerticalIcon, PlusIcon, TrashIcon } from './Icons';
import type { SearchEngine, UpdateSettings, UserSettings } from '../types';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';
import { getSafeSvgDataUri, sanitizeSvgMarkup } from '../utils/sanitizeSvg';

interface SearchEngineManagerProps {
  settings: UserSettings;
  onUpdateSettings: UpdateSettings;
}

const SearchEngineManager: React.FC<SearchEngineManagerProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [newEngineIcon, setNewEngineIcon] = useState('');
  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { showToast } = useToast();
  const { t } = useTranslation();
  const sanitizedPreviewIcon = useMemo(
    () => getSafeSvgDataUri(newEngineIcon),
    [newEngineIcon]
  );

  const resetForm = useCallback(() => {
    setNewEngineName('');
    setNewEngineUrl('');
    setNewEngineIcon('');
    setEditingOriginalName(null);
    setIsAddingEngine(false);
  }, []);

  const handleDeleteEngine = useCallback(
    (nameToDelete: string) => {
      if (settings.searchEngines.length <= 1) {
        return;
      }

      onUpdateSettings((current) => {
        const updatedEngines = current.searchEngines.filter(
          (engine) => engine.name !== nameToDelete
        );
        const selected =
          current.selectedEngine === nameToDelete
            ? updatedEngines[0]?.name ?? ''
            : current.selectedEngine;
        return { searchEngines: updatedEngines, selectedEngine: selected };
      });
      showToast(t.searchEngineDeleted, 'success');
    },
    [onUpdateSettings, settings.searchEngines.length, showToast, t.searchEngineDeleted]
  );

  const handleSetDefault = useCallback(
    (name: string) => {
      onUpdateSettings({ selectedEngine: name });
    },
    [onUpdateSettings]
  );

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      onUpdateSettings((current) => {
        const updatedEngines = [...current.searchEngines];
        const [dragged] = updatedEngines.splice(draggedIndex, 1);
        updatedEngines.splice(index, 0, dragged);
        return { searchEngines: updatedEngines };
      });
      setDraggedIndex(index);
    },
    [draggedIndex, onUpdateSettings]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleEditEngine = useCallback((engine: SearchEngine) => {
    setNewEngineName(engine.name);
    setNewEngineUrl(engine.urlPattern);
    setNewEngineIcon(engine.icon ?? '');
    setEditingOriginalName(engine.name);
    setIsAddingEngine(true);
  }, []);

  const handleSaveEngine = useCallback(() => {
    const name = newEngineName.trim();
    const urlPattern = newEngineUrl.trim();
    if (!name || !urlPattern) {
      return;
    }

    const isRenaming = Boolean(editingOriginalName && editingOriginalName !== name);
    const isAdding = !editingOriginalName;

    if (isAdding || isRenaming) {
      const exists = settings.searchEngines.some((engine) => engine.name === name);
      if (exists) {
        showToast(t.duplicateEngineName, 'error');
        return;
      }
    }

    const previousEngine = editingOriginalName
      ? settings.searchEngines.find((engine) => engine.name === editingOriginalName)
      : undefined;
    const rawIcon = newEngineIcon.trim();
    const icon = rawIcon ? sanitizeSvgMarkup(rawIcon) : undefined;
    if (rawIcon && !icon) {
      showToast(t.invalidSvgIcon, 'error');
      return;
    }

    const nextEngine: SearchEngine = {
      name,
      urlPattern,
      icon,
      iconKey: icon ? undefined : previousEngine?.iconKey,
    };

    onUpdateSettings((current) => {
      const updatedEngines = [...current.searchEngines];
      let nextSelected = current.selectedEngine;

      if (editingOriginalName) {
        const index = updatedEngines.findIndex((engine) => engine.name === editingOriginalName);
        if (index !== -1) {
          updatedEngines[index] = nextEngine;
        }
        if (current.selectedEngine === editingOriginalName) {
          nextSelected = nextEngine.name;
        }
      } else {
        updatedEngines.push(nextEngine);
      }

      return { searchEngines: updatedEngines, selectedEngine: nextSelected };
    });

    showToast(
      editingOriginalName ? t.searchEngineUpdated : t.newSearchEngineAdded,
      'success'
    );
    resetForm();
  }, [
    editingOriginalName,
    newEngineIcon,
    newEngineName,
    newEngineUrl,
    onUpdateSettings,
    resetForm,
    settings.searchEngines,
    showToast,
    t.duplicateEngineName,
    t.invalidSvgIcon,
    t.newSearchEngineAdded,
    t.searchEngineUpdated,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {t.searchEngines}
        </span>
        {!isAddingEngine && (
          <button
            onClick={() => setIsAddingEngine(true)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: settings.themeColor }}
            title={t.addCustomEngine}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {settings.searchEngines.map((engine, index) => (
          <div
            key={engine.name}
            draggable
            onDragStart={(event) => handleDragStart(event, index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 group transition-all duration-200
              ${draggedIndex === index ? 'opacity-40 border-dashed border-white/30' : ''}
              ${editingOriginalName === engine.name ? 'ring-1 ring-white/30 bg-white/10' : ''}
            `}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 p-1 flex-shrink-0">
                <GripVerticalIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white/90 truncate">{engine.name}</span>
                <span className="text-[10px] text-white/40 truncate font-mono">
                  {engine.urlPattern}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2 flex-shrink-0">
              {settings.selectedEngine === engine.name ? (
                <span className="text-[10px] font-medium bg-white/20 text-white/90 px-2 py-1 rounded-md whitespace-nowrap cursor-default">
                  {t.current}
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(engine.name)}
                  className="text-[10px] font-medium bg-transparent hover:bg-white/10 text-white/40 hover:text-white px-2 py-1 rounded-md border border-white/10 transition-colors"
                >
                  {t.setDefault}
                </button>
              )}
              <button
                onClick={() => handleEditEngine(engine)}
                className="p-1.5 rounded-md transition-colors text-white/20 hover:bg-white/10 hover:text-white"
                title={t.edit}
              >
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteEngine(engine.name)}
                disabled={settings.searchEngines.length <= 1}
                className={`
                  p-1.5 rounded-md transition-colors
                  ${
                    settings.searchEngines.length <= 1
                      ? 'opacity-0 cursor-default'
                      : 'text-white/20 hover:bg-red-500/20 hover:text-red-400'
                  }
                `}
                title={t.delete}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddingEngine && (
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white/80">
              {editingOriginalName ? t.editSearchEngine : t.addCustomEngine}
            </span>
          </div>

          <div className="space-y-1">
            <label htmlFor="engine-name" className="text-xs text-white/40 ml-1">
              {t.name}
            </label>
            <input
              id="engine-name"
              type="text"
              value={newEngineName}
              onChange={(event) => setNewEngineName(event.target.value)}
              placeholder="e.g.: Google"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="engine-url" className="text-xs text-white/40 ml-1">
              {t.searchUrl}
            </label>
            <input
              id="engine-url"
              type="text"
              value={newEngineUrl}
              onChange={(event) => setNewEngineUrl(event.target.value)}
              placeholder="https://example.com/search?q=%s"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none transition-colors font-mono"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="engine-icon" className="text-xs text-white/40 ml-1">
              {t.svgIconCode} ({t.optional})
            </label>
            <textarea
              id="engine-icon"
              value={newEngineIcon}
              onChange={(event) => setNewEngineIcon(event.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none transition-colors font-mono resize-none"
              rows={3}
            />
            {newEngineIcon.trim() && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded-lg">
                <span className="text-xs text-white/40">{t.preview}:</span>
                {sanitizedPreviewIcon ? (
                  <img
                    src={sanitizedPreviewIcon}
                    alt=""
                    aria-hidden="true"
                    className="w-5 h-5"
                  />
                ) : (
                  <span className="text-[11px] text-red-300">{t.invalidSvgIcon}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveEngine}
              disabled={!newEngineName.trim() || !newEngineUrl.trim()}
              className="px-3 py-1.5 text-xs bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingOriginalName ? t.save : t.add}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchEngineManager;
