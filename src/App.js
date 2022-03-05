import {useEffect} from 'react';
import AddPost from "./components/AddPost";
import PostsList from "./components/PostsList";
import {useState} from "react";
import logo from './assets/img/logo.svg'
import fb from './assets/img/fb.svg'
import tg from './assets/img/tg.svg'
import ig from './assets/img/ig.svg'
import apstore from './assets/img/apstore.svg'
import gplay from './assets/img/gplay.svg'
import axios from "axios";
import firebase from './firebase/firebase';
import {getToken, initializeAppCheck, ReCaptchaV3Provider} from "firebase/app-check";

function App() {

  const [createPopupOpened, setCreatePopupOpened] = useState(false)
  const [shouldReloadPosts, setShouldReloadPosts] = useState(false)
  const [appCheckToken, setAppCheckToken] = useState(null)
  const [appCheckFetched, setAppCheckFetched] = useState(false)

  const getAppCheckTokenRequest = async () => {
    const appCheck = await initializeAppCheck(firebase?.app, {
      provider: new ReCaptchaV3Provider(),
      isTokenAutoRefreshEnabled: true
    })
    let token
    try {token = await getToken(appCheck)} catch (error) {return new Error()}
    if (token?.token) {token = token?.token} else {return null}
    if (token) { return token } else { return null }
  }

  useEffect(() => {
    if (firebase?.app) getAppCheckTokenRequest().then(res => {
      if (res) {
        if (res instanceof Error) {
          setAppCheckFetched(true)
        } else {
          setAppCheckToken(res)
          setAppCheckFetched(true)
        }
      }
    })
  }, [])

  useEffect(() => {
    document.body.classList.toggle('modal-open', createPopupOpened);
  },[createPopupOpened])

  useEffect(() => {
    axios.get('https://ipapi.co/json/').then((response) => {
      const data = response.data
      if (
        data.country_name === "Russia" ||
        data.country_calling_code === "+7" ||
        data.country_code === "RU"
      ) window.location.replace("https://savelife.in.ua/ru/donate/")
    }).catch((error) => console.log(error))
  }, [])

  return (
    <div className="app">
      {createPopupOpened ?
        <AddPost
          appCheckToken={appCheckToken}
          close={() => {
            setCreatePopupOpened(false)
            setShouldReloadPosts(true)
            window.scrollTo(0, 0)
          }}
        /> :
        <div>
          <div className="header base-padding">
            <img src={logo} alt="HELP.UA"/>
            <button className="btn accent-btn add-btn" onClick={() => setCreatePopupOpened(true)}>
              Додати оголошення
            </button>
          </div>
        </div>
      }
      <PostsList
        shouldReload={shouldReloadPosts}
        setCreatePopupOpened={setCreatePopupOpened}
        onReload={() => setShouldReloadPosts(false)}
        appCheckToken={appCheckToken}
        appCheckFetched={appCheckFetched}
      />
      {createPopupOpened ? <div className="backdrop" onClick={() => setCreatePopupOpened(false)}></div> : null}

      <footer className="footer-section">
        <div className="logo-item-footer" style={{display:'flex', justifyContent:'center'}}>
          <img src={logo} alt="HELP.UA"/>
        </div>
          <p style={{textAlign:'center'}}>Cервіс для пошуку та надання допомоги 
цивільним, теробороні та армії ЗСУ</p>
          <span style={{textAlign:'center', marginBottom:'14px'}}>Наші соціальні мережі</span>
        <div className="social-icons">
        <a href="https://m.facebook.com/helpmeuacom" rel="noreferrer" target="_blank"><img src={fb} alt="facebook"/></a>
        <a href="http://www.instagram.com/helpmeuacom" rel="noreferrer" target="_blank"><img src={ig} alt="instagram"/></a>
        <a href="http://t.me/helpmeuacom" rel="noreferrer" target="_blank"><img src={tg} alt="telegram"/></a>
        </div>
        <span style={{textAlign:'center'}}>Наш додаток</span>
        <div className="application-market" style={{display:'flex', justifyContent:'space-around'}}>
          <div
            style={{cursor: 'pointer'}}
            onClick={() => alert("Додаток ще на стадії розробки. Вибачте за незручності, скоро буде!")}>
            <img src={apstore} width="163px" alt="appstore"/>
          </div>
          <div
            style={{cursor: 'pointer'}}
            onClick={() => alert("Додаток ще на стадії розробки. Вибачте за незручності, скоро буде!")}>
            <img src={gplay} width="163px" height="48px" alt="gplay"/>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App;
