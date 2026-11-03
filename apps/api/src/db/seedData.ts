export interface SeedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

/** Catalog carried over unchanged from the original index.html (names, prices, image references). */
export const SEED_PRODUCTS: readonly SeedProduct[] = [
  { id: 1, name: '無線藍牙耳機', price: 2999, imageUrl: 'earphones.jpg' },
  { id: 2, name: '智慧手錶', price: 8999, imageUrl: 'smartwatch.jpg' },
  { id: 3, name: '便攜式充電器', price: 1299, imageUrl: 'powerbank.jpg' },
  { id: 4, name: '無線滑鼠', price: 899, imageUrl: 'mouse.jpg' },
  { id: 5, name: '機械鍵盤', price: 3999, imageUrl: 'keyboard.jpg' },
  { id: 6, name: '網路攝影機', price: 2199, imageUrl: 'webcam.jpg' },
  { id: 7, name: 'USB隨身碟', price: 599, imageUrl: 'usb.jpg' },
  { id: 8, name: '桌面擴音器', price: 1599, imageUrl: 'speaker.jpg' },
];
