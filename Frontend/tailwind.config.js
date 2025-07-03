/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // تفعيل الوضع الليلي بناءً على وجود الكلاس 'dark' على وسم HTML
  content: [
    "../public/**/*.html", // مسار لملفات HTML التي تحتوي على كلاسات Tailwind
    "../src/**/*.js",      // مسار لملفات JavaScript التي قد تحتوي على كلاسات Tailwind
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
