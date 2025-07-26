export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} ShowBooker. All rights reserved.</p>
        <p>Designed with ❤️ by Gemini</p>
      </div>
    </footer>
  );
}
