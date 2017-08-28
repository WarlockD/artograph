const DB_VERSION = 1;

export function saveObject(objectId, object) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bigObjects', DB_VERSION);
    req.onerror = reject;
    req.onupgradeneeded = function(event) {
      const db = event.target.result;
      db.createObjectStore('bigObjects');
    };
    req.onsuccess = function(event) {
      const db = event.target.result;
      const req = db.transaction(['bigObjects'], 'readwrite')
        .objectStore('bigObjects')
        .put(object, objectId);
      req.onerror = function(err) {
        db.close();
        reject(err);
      };
      req.onsuccess = function() {
        db.close();
        resolve();
      };
    };
  });
}

export function loadObject(objectId) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bigObjects', DB_VERSION);
    req.onerror = reject;
    req.onupgradeneeded = function(event) {
      const db = event.target.result;
      db.createObjectStore('bigObjects');
    }
    req.onsuccess = function(event) {
      const db = event.target.result;
      const req = db.transaction(['bigObjects'], 'readonly')
        .objectStore('bigObjects')
        .get(objectId);
      req.onerror = function(err) {
        db.close();
        reject(err);
      };
      req.onsuccess = function() {
        db.close();
        resolve(req.result);
      };
    };
  });
}
