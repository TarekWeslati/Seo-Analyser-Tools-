/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // هذا المسار يخبر Tailwind بالبحث عن فئاته في ملف index.html
    // الذي هو موجود في 'public' داخل 'frontend'
    "./public/**/*.html",
    // هذا المسار يخبر Tailwind بالبحث عن فئاته في ملفات JS
    // داخل مجلد 'js' الذي هو داخل 'public'
    "./public/**/*.js",
    // إذا كان لديك أي ملفات أخرى تستخدم فيها فئات Tailwind، أضف مساراتها هنا
    // على سبيل المثال، إذا كان لديك ملفات .jsx أو .ts في مجلد 'src'
    // "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
