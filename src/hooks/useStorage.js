import { useState, useEffect } from 'react';

// 获取浏览器存储 API
const getStorage = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local;
  }
  return null;
};

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  const storage = getStorage();

  useEffect(() => {
    if (!storage) {
      return;
    }

    // 读取初始值
    storage.get([key], (result) => {
      if (result[key] !== undefined) {
        setValue(result[key]);
      }
    });

    // 监听变化
    const listener = (changes, areaName) => {
      if (areaName === 'local' && changes[key]) {
        setValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [key, storage]);

  const updateValue = (newValue) => {
    setValue(newValue);
    if (storage) {
      storage.set({ [key]: newValue });
    }
  };

  return [value, updateValue];
};

