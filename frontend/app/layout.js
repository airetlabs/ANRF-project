import "./globals.css";

import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "AcadAIsist",
  description: "Faculty Assessment Platform",
};

export default function RootLayout({ children }) {

  return (

    <html lang="en">

      <body>

        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#fff",
              borderRadius: "14px",
              padding: "14px 18px",
              fontSize: "14px"
            }
          }}
        />

      </body>

    </html>
  );
}