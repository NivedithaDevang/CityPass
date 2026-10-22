export interface OrganiserEventDraftForm {
  name: string;
  description: string;
  instructions: string;
  location: string;
  city_id: string;
  category_id: string;
  event_date: string;
  time: string;
  price: number | "";
  capacity: string;
  age_group: string;
  duration: string;
}

export interface OrganiserEventDraftTicket {
  name: string;
  description: string;
  price: string;
}

export interface OrganiserEventDraft {
  id: string;
  organiserId: string;
  createdAt: string;
  updatedAt: string;
  formData: OrganiserEventDraftForm;
  selectedLanguages: string[];
  tickets: OrganiserEventDraftTicket[];
  image: File | null;
}

const DATABASE_NAME = "citypass-organiser-event-drafts";
const DATABASE_VERSION = 1;
const STORE_NAME = "drafts";

const openDraftDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open saved event drafts."));
    request.onblocked = () =>
      reject(new Error("Saved event drafts are blocked by another browser tab."));
  });

export const getOrganiserEventDrafts = async (
  organiserId: string,
): Promise<OrganiserEventDraft[]> => {
  const database = await openDraftDatabase();

  try {
    const drafts = await new Promise<OrganiserEventDraft[]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => {
        resolve(
          (request.result as OrganiserEventDraft[])
            .filter((draft) => draft.organiserId === organiserId)
            .sort((first, second) =>
              second.updatedAt.localeCompare(first.updatedAt),
            ),
        );
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load saved event drafts."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Could not load saved event drafts."));
    });

    return drafts;
  } finally {
    database.close();
  }
};

export const saveOrganiserEventDraft = async (
  draft: OrganiserEventDraft,
): Promise<void> => {
  const database = await openDraftDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(draft);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save the event draft."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Could not save the event draft."));
    });
  } finally {
    database.close();
  }
};

export const deleteOrganiserEventDraft = async (
  id: string,
): Promise<void> => {
  const database = await openDraftDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not delete the event draft."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Could not delete the event draft."));
    });
  } finally {
    database.close();
  }
};
