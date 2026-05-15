import '../index.css';

export const metadata = {
  title: 'Zeus Legacy Slot',
  description: 'A React-based Zeus Legacy slot machine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
