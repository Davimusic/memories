import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <PayPalScriptProvider 
        options={{ 
          "client-id": "AbyHsDXyJLxKBgCHv9BAeVbt-JLALZCJ4q_Z1m-dKA58ime8dXCgHL0ycehEvOH1ceJvjCzUOmzUAADN",
          components: "buttons",
          intent: "subscription",
          vault: true,
          currency: "USD"
        }}
      >
        <Component {...pageProps} />
      </PayPalScriptProvider>
    </SessionProvider>
  );
}







/*import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return<Component/>
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}*/
