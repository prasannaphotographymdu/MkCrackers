import { cleanImageUrl } from './src/lib/utils';
console.log(cleanImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD...'));
console.log(cleanImageUrl('https://unsplash.com/photos/12345678901'));
