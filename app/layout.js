import './globals.css';

export const metadata = {
  title: 'MotoTrack',
  description: 'Motorcycle maintenance and spare parts tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
