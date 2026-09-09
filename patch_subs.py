with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

subs = """
export function subscribeCategories(
  callback: (categories: Category[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, CATEGORIES_COL),
    (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => cats.push({ id: doc.id, ...doc.data() } as Category));
      callback(cats);
    },
    (err) => { console.error('Firestore read error:', err.message); if(onError) onError(err); }
  );
}

export function subscribeEnquiries(
  callback: (enquiries: Enquiry[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, ENQUIRIES_COL), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) => {
      const enqs: Enquiry[] = [];
      snapshot.forEach((doc) => enqs.push({ id: doc.id, ...doc.data() } as Enquiry));
      callback(enqs);
    },
    (err) => { console.error('Firestore read error:', err.message); if(onError) onError(err); }
  );
}

export function subscribeInvoices(
  callback: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, INVOICES_COL), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) => {
      const invs: Invoice[] = [];
      snapshot.forEach((doc) => invs.push({ id: doc.id, ...doc.data() } as Invoice));
      callback(invs);
    },
    (err) => { console.error('Firestore read error:', err.message); if(onError) onError(err); }
  );
}

export function subscribeStockOutNotifications(
  callback: (notifications: any[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    query(collection(db, 'stockOutNotifications'), orderBy('createdAt', 'desc'), limit(50)),
    (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((doc) => notifs.push({ id: doc.id, ...doc.data() }));
      callback(notifs);
    },
    (err) => { console.error('Firestore read error:', err.message); if(onError) onError(err); }
  );
}
"""

content = content.replace("export function subscribeOfflineOrders(", subs + "\nexport function subscribeOfflineOrders(")

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
