export interface CommonStorage {
  set(key: string, value: any): void | Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
}

export class ChromeSyncStorageImpl implements CommonStorage {
  public async set(key: string, item: Object): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let tempObject: any = {};
      tempObject[key] = item;
      chrome.storage.sync.set(tempObject, () => {
        let err = chrome.runtime.lastError;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async get<T>(key: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      chrome.storage.sync.get(key, (item: any) => {
        let err = chrome.runtime.lastError;
        if (err) {
          reject(err);
        } else {
          const date = item[key];
          resolve(date);
        }
      });
    });
  }
}

export interface TypedCommonStorageInterface {
  getPreference(): Promise<PreferenceStorage>;

  /** --------账户相关--------- */

  addAccount(account: AccountPreference): Promise<void>;

  deleteAccountById(accessToken: string): Promise<void>;

  getAccounts(): Promise<AccountPreference[]>;

  setDefaultAccountId(accountId: string): Promise<void>;

  getDefaultAccountId(): Promise<string | undefined>;

  /** --------默认插件--------- */

  setDefaultPluginId(id: string | null): Promise<void>;

  getDefaultPluginId(): Promise<string | undefined | null>;

  /** --------显示二维码--------- */

  setShowQuickResponseCode(value: boolean): Promise<void>;

  getShowQuickResponseCode(): Promise<boolean>;

  /** --------编辑器显示行号--------- */

  setShowLineNumber(value: boolean): Promise<void>;

  getShowLineNumber(): Promise<boolean>;

  /** --------实时渲染--------- */
  setLiveRendering(value: boolean): Promise<void>;

  getLiveRendering(): Promise<boolean>;
}

const keysOfStorage = {
  accounts: 'accounts',
  defaultAccountId: 'defaultAccountId',
  defaultPluginId: 'defaultPluginId',
  showQuickResponseCode: 'showQuickResponseCode',
  liveRendering: 'liveRendering',
  showLineNumber: 'showLineNumber'
};

export class TypedCommonStorage implements TypedCommonStorageInterface {
  store: CommonStorage;

  constructor(store: CommonStorage) {
    this.store = store;
  }

  getPreference = async (): Promise<PreferenceStorage> => {
    const accounts = await this.getAccounts();
    const defaultPluginId = await this.getDefaultPluginId();
    const defaultAccountId = await this.getDefaultAccountId();
    const showQuickResponseCode = await this.getShowQuickResponseCode();
    const showLineNumber = await this.getShowLineNumber();
    const liveRendering = await this.getLiveRendering();
    return {
      accounts,
      defaultPluginId,
      defaultAccountId,
      showQuickResponseCode,
      showLineNumber,
      liveRendering
    };
  };

  deleteAccountById = async (id: string) => {
    const accounts = await this.getAccounts();
    const newAccounts = accounts.filter(account => account.id !== id);
    const defaultAccountId = await this.getDefaultAccountId();
    if (defaultAccountId === id) {
      if (newAccounts.length > 0) {
        await this.setDefaultAccountId(newAccounts[0].id);
      } else {
        // eslint-disable-next-line no-undefined
        await this.store.set(keysOfStorage.defaultAccountId, undefined);
      }
    }
    await this.store.set(keysOfStorage.accounts, newAccounts);
  };

  addAccount = async (account: AccountPreference) => {
    const accounts = await this.getAccounts();
    if (accounts.findIndex(o => o.id === account.id) !== -1) {
      throw new Error('Do not allow duplicate accounts');
    }
    accounts.push(account);
    if (accounts.length === 1) {
      await this.setDefaultAccountId(account.id);
    }
    await this.store.set(keysOfStorage.accounts, accounts);
  };

  getAccounts = async () => {
    const value = await this.store.get<AccountPreference[]>(
      keysOfStorage.accounts
    );
    if (!value) {
      return [];
    }
    return value;
  };

  setDefaultAccountId = async (value: string) => {
    await this.store.set(keysOfStorage.defaultAccountId, value);
  };

  getDefaultAccountId = async () => {
    return this.store.get<string>(keysOfStorage.defaultAccountId);
  };

  setDefaultPluginId = async (value: string | null) => {
    await this.store.set(keysOfStorage.defaultPluginId, value);
  };
  getDefaultPluginId = async () => {
    return this.store.get<string>(keysOfStorage.defaultPluginId);
  };

  setShowQuickResponseCode = async (value: boolean) => {
    await this.store.set(keysOfStorage.showQuickResponseCode, value);
  };
  getShowQuickResponseCode = async () => {
    const value = await this.store.get<boolean>(
      keysOfStorage.showQuickResponseCode
    );
    return value === true;
  };

  setShowLineNumber = async (value: boolean) => {
    await this.store.set(keysOfStorage.showLineNumber, value);
  };
  getShowLineNumber = async () => {
    const value = await this.store.get<boolean>(keysOfStorage.showLineNumber);
    return value !== false;
  };

  setLiveRendering = async (value: boolean) => {
    await this.store.set(keysOfStorage.liveRendering, value);
  };
  getLiveRendering = async () => {
    const value = await this.store.get<boolean>(keysOfStorage.liveRendering);
    return value !== false;
  };
}

export default new TypedCommonStorage(
  new ChromeSyncStorageImpl()
) as TypedCommonStorageInterface;
