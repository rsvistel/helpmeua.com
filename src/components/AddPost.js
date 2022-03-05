import React, {useState} from "react";
import axios from "../axios-config";
import GooglePlacesAutocomplete, {geocodeByAddress} from 'react-google-places-autocomplete';
import {tags} from "../consts/tags";
import { v4 as uuid } from 'uuid';
import back from '../assets/img/back.svg';

const AddPost = props => {

  const initialFormData = {
    title: '',
    name: '',
    message: '',
    phone: '',
    telegram: '',
    location: {},
    tags: [],
    type: 'Asking help'
  }

  const [formData, setFormData] = useState(initialFormData)

  const [loading, setLoading] = useState(false)

  const inputs = [
    {
      label: "Заголовок:",
      name: 'title',
      type: 'text',
      required: false,
      placeholder:'Вкажіть заголовок',
      limit: 50
    },
    {
      label: "Текст*:",
      name: 'message',
      type: 'textarea',
      required: true,
      placeholder:'Інформація, яку потрібно надати: як ви можете допомогти, або що потребуєте (бажано вказувати інформацію лаконічно та чітко: наприклад, необхідно зібрати 15 пар чобіт для тероборони)',
      limit: 400
    },
    {label: "Локація", name: 'location', type: 'location', required: false, placeholder: 'Локація'},
    {label: "Звʼязатися:", name: 'name', type: 'text', required: false, placeholder: 'Імʼя', limit: 100},
    {name: 'phone', type: 'text', required: false, placeholder: 'Контактний номер', limit: 50},
    {name: 'telegram', type: 'text', required: false, placeholder: 'Нікнейм в телеграмі', limit: 50},
    {label: "Теги", name: 'tags', type: 'tags', required: false}
  ]

  const TagsSelector = () => {
    return (
        tags.map((tag, index) => (
          <div className={`btn grey-btn tag ${formData.tags.includes(tag) ? 'included' : ''}`} key={index} onClick={() => {
            const tags = [...formData.tags]
            if (tags.includes(tag)) {
              const index = tags.indexOf(tag)
              if (index > -1) tags.splice(index, 1)
            } else {tags.push(tag)}
            setFormData({...formData, tags: tags})
          }}>
            {tag}
          </div>
      ))
    )
  }

  return(
    <form 
      className="add-post"
      onSubmit={(event) => {
      event.preventDefault()
      setLoading(true)
      const padTo2Digits = num => num.toString().padStart(2, '0')
      const formatDate = (date) => {
        return [
          padTo2Digits(date.getDate()),
          padTo2Digits(date.getMonth() + 1),
          date.getFullYear()
        ].join('/')
        + ' ' +
        [
          padTo2Digits(date.getHours()),
          padTo2Digits(date.getMinutes())
        ].join(':')
      }
      const date = formatDate(new Date())
      const submit = () => {
        const id = uuid()
        axios.get('/posts.json?orderBy="id"&equalTo="' + id + '"', {
          headers: {
            'X-Firebase-AppCheck': props?.appCheckToken
          }
        })
          .then(res => {
            if (!res.data || Object.entries(res.data).length === 0) {
              axios.post('/posts.json',
                {...formData, date: date, publishDate: new Date().getTime(), id: uuid()})
                .then(() => {
                  setLoading(false)
                  setFormData(initialFormData)
                  props.close()
                })
                .catch(() => setLoading(false))
            } else {submit()}
          })
          .catch(err => console.log(err))
      }
      submit()
    }}>
      <div className="nav-title">
        <img src={back} alt="help ua" onClick={() => props.close()} style={{cursor: 'pointer'}}/>
        <h2>Додати оголошення</h2>
      </div>
      <div>
        <span className="label-space">Виберіть:</span>
        <div className="type-help">
          <input
            className="d-none"
            type="radio"
            id="asking-help"
            name="type"
            value="Asking help"
            defaultChecked
            onChange={(event) => {
              setFormData({...formData, type: event.target.value})
            }}/>
          <label className="btn grey-btn btn-cube btn-label btn-label-first" htmlFor="asking-help">Допоможіть мені</label>
          <input
            className="d-none"
            type="radio"
            id="suggesting-help"
            name="type"
            value="Suggesting help"
            onChange={(event) => {
              setFormData({...formData, type: event.target.value})
            }}/>
          <label className="btn grey-btn btn-cube btn-label" htmlFor="suggesting-help">Хочу допомогти</label>
        </div>
      </div>
      {inputs.map((input, index) => (
        input.type === "location" ?
        <div key={index}>
          <span className="label-space">Локація:</span>
          <GooglePlacesAutocomplete
            key={index}
            selectProps={{
              isClearable: true,
              placeholder: 'Локація',
              onChange: val => {
                val?.label && (
                  geocodeByAddress(val.label)
                    .then(results => setFormData({...formData, location: results}))
                    .catch(error => console.error(error))
                )
              }
            }}
          />
          </div> :
        input.type === "tags" ?
        <div key={index}>
          <span className="label-space">Теги:</span>
          <div className="tags">
            <TagsSelector key={index}/>
          </div>
        </div> :
        input.type === "textarea" ?   
          <div key={index}>
            <label className="label-space" htmlFor={input.name}>{input.label}</label>
            <textarea
              type={input.type}
              name={input.name}
              value={formData[input.name]}
              placeholder={input.placeholder}
              onChange={(event) => {
                setFormData({...formData, [input.name]: event.target.value})
              }}
              maxLength={input.limit}
              required={input.required}
            />
          </div>
         :
          <div key={index}>
            <label className="label-space" htmlFor={input.name}>{input.label}</label>
            <input
              type={input.type}
              name={input.name}
              value={formData[input.name]}
              placeholder={input.placeholder}
              onChange={(event) => {
                setFormData({...formData, [input.name]: event.target.value})
              }}
              maxLength={input.limit}
              required={input.required}
            />
          </div>
      ))}
      <div className="inform-block">
          <h2>Памʼятайте!</h2>
          <p>Перш ніж допомогти людині, яка залишила запит у волонтерському чаті, будь ласка, переконайтесь, що це не ворог. В умовах інформаційної війни росіяни та недобросовісні люди намагаються використати ситуацію на свою користь. Пильнуйте за цим! Будьте пильні та не розголошуйте жодної інформацію про наших військових незнайомим людям!</p>
          <h3>Ваш Help.UA</h3>
      </div>
      <div className="block-btn">
        <button className="cancel" type="reset" onClick={() => props.close()}>Cancel</button>
        <button className="create" type="submit" disabled={loading}>{loading ? 'Saving' : 'Create'}</button>
      </div>
    </form>
  )
}

export default AddPost