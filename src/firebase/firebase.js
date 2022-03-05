import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(),
  isTokenAutoRefreshEnabled: true
});

export {
  app, analytics, appCheck as default
}