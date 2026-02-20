import { useCallback, useEffect, useReducer, useRef } from 'react';
import { DEFAULT_SETTINGS } from '@/constants';
import { loadSettings, saveSettings } from '@/utils/storage';
import type { SettingsPatch, UpdateSettings, UserSettings } from '@/types';

type Action =
  | { type: 'replace'; value: UserSettings }
  | { type: 'patch'; patch: SettingsPatch };

const reducer = (state: UserSettings, action: Action): UserSettings => {
  switch (action.type) {
    case 'replace':
      return action.value;
    case 'patch': {
      const partial =
        typeof action.patch === 'function' ? action.patch(state) : action.patch;
      return { ...state, ...partial };
    }
    default:
      return state;
  }
};

export const useSettingsStore = () => {
  const [settings, dispatch] = useReducer(
    reducer,
    DEFAULT_SETTINGS,
    (initial) => loadSettings(initial)
  );
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveSettings(settings);
  }, [settings]);

  const replaceSettings = useCallback((value: UserSettings) => {
    dispatch({ type: 'replace', value });
  }, []);

  const updateSettings: UpdateSettings = useCallback((patch) => {
    dispatch({ type: 'patch', patch });
  }, []);

  return {
    settings,
    replaceSettings,
    updateSettings,
  };
};
