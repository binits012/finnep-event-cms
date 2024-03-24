import Router from "next/router";
import { useEffect } from "react";

const useWarnIfUnsavedChanges = (unsavedChanges, callback) => {
  useEffect(() => {
    if (unsavedChanges) {
      const routeChangeStart = (url) => {
        const ok = callback();
        // console.log("ok", ok);
        if (!ok) {
          // console.log("ok not ok", ok);
          // Router.events.emit("routeChangeError");
          // Router.replace(Router, Router.asPath, { shallow: true });
          throw "Abort route change. Please ignore this error.";
        }
      };

      Router.events.on("routeChangeStart", routeChangeStart);

      return () => {
        Router.events.off("routeChangeStart", routeChangeStart);
      };
    }
  }, [callback, unsavedChanges]);
};

export { useWarnIfUnsavedChanges };
