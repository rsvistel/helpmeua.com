import React, {useCallback, useEffect, useState} from "react";
import axios from "../axios-config";
import GooglePlacesAutocomplete, { geocodeByAddress } from "react-google-places-autocomplete";
import {tags} from "../consts/tags";

const PostsList = props => {

  const [posts, setPosts] = useState([])
  const [postsRaw, setPostsRaw] = useState([])
  const [postsFilteredByLocation, setPostsFilteredByLocation] = useState([])
  const [appliedTags, setAppliedTags] = useState([])
  const [appliedCategory, setAppliedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  const reportLimit = 10

  const fetchPosts = useCallback(() => {
    if (!props.appCheckFetched) return
    axios.get( '/posts.json?orderBy="publishDate"&limitToLast=1000', {
      headers: {
        'X-Firebase-AppCheck': props?.appCheckToken
      }
    })
      .then(res => {
        let postsArray = []
        for (let key in res.data) {postsArray.push({...res.data[key]})}
        setPosts(postsArray.reverse())
        setPostsRaw(postsArray.reverse())
        setPostsFilteredByLocation(postsArray.reverse())
        setAppliedTags([])
        setAppliedCategory(null)
        setLoading(false)
        props.onReload()
      })
      .catch(err => console.log(err))
  }, [props])

  useEffect(() => fetchPosts(), [fetchPosts])
  useEffect(() => {if (props.shouldReload) fetchPosts()}, [fetchPosts, props.shouldReload])

  const Post = ({data}) => {
    const [reportSent, setReportSent] = useState(false)
    const [reportSending, setReportSending] = useState(false)

    const myReports = localStorage.getItem('reportedPosts')
    let isReported = false
    if (myReports && Array.isArray(JSON.parse(myReports))) {
      if ([...JSON.parse(myReports)].includes(data.id)) isReported = true
    }

    if (isReported) return null
    return (
      <div className="post-wrap">
      <div className="post">
        {data.type &&
          <h4 className={data.type === 'Asking help' ? 'ask' : 'suggest'}>
            {data.type === 'Asking help' ? 'Допоможіть мені' : 'Хочу допомогти'}
          </h4>
        }
        {data.title && <h2>{data.title}</h2>}
        {data.date && <p className="date">{data.date}</p>}
        {data.date && <p className="message">{data.message}</p>}
        {data.location && <p><span>Location:</span> {data.location && data.location[0].formatted_address}</p>}
        {data.name && <p><span>Ім'я:</span> {data.name}</p>}
        {data.phone && <p><span>Номер:</span> {data.phone}</p>}
        {data.telegram && <p><span>Телеграм:</span> @{data.telegram}</p>}
        {data.tags && (
          <div className="tags tags-start">
            {data.tags?.map((tag, index) => (
              <div className="btn post-tag-color tag" key={index}>{tag}</div>
            ))}
          </div>
        )}
        {(data.id && !reportSent) && (
          <button onClick={() => {
            setReportSending(true)
            axios.get('/posts.json?orderBy="id"&equalTo="' + data.id + '"')
              .then(res => {
                const currentReports = data.report
                let newReportNumber = 1
                if (currentReports && parseInt(currentReports)) newReportNumber = parseInt(currentReports) + 1
                axios.put('/posts/' + Object.keys(res.data)[0] + '/report.json', newReportNumber)
                  .then(() => {
                    const myReports = localStorage.getItem('reportedPosts')
                    const newReportsArray = myReports && Array.isArray(JSON.parse(myReports)) ?
                      [...JSON.parse(myReports)] : []
                    if (!newReportsArray?.includes(data.id)) {
                      newReportsArray.push(data.id)
                      localStorage.setItem('reportedPosts', JSON.stringify(newReportsArray))
                      setReportSent(true)
                    }
                  })
                  .catch(() => setReportSending(false))
              })
              .catch(() => setReportSending(false))
          }} disabled={reportSending} className="report-button">
            {reportSending ? "Sending" : "Поскаржитися"}
          </button>
        )}
        {reportSent && <div>Report sent</div>}
      </div>
      </div>
    )
  }

  const filterByType = type => {
    const postsByLocation = (
      [...appliedTags].length > 0 ?
        [...postsFilteredByLocation].filter(post => {
          let shouldBeDisplayed = false;
          [...appliedTags].forEach(filter => {if (post.tags?.includes(filter)) shouldBeDisplayed = true})
          return shouldBeDisplayed
        })
        :
        [...postsFilteredByLocation]
    )
    setAppliedCategory(type)
    setPosts(postsByLocation.filter(post => post.type === type))
  }

  return (
    loading ?
      <div>Loading</div> :
      <div className="autocomplete-block">
        <div className="autocomplete-padding">
          <h1 className="title">Швидкий і легкий пошук допомогти за тегами</h1>
        <GooglePlacesAutocomplete
          apiOptions={{ language: 'ua', region: 'ua' }}
          // placeholder='Назва населеного пункту, послуга, життєва ситуація'
          selectProps={{
            isClearable: true,
            placeholder: 'Вкажіть локацію для пошуку',
            onChange: val => {
              if (!val) {
                setAppliedTags([])
                setPostsFilteredByLocation([...postsRaw])
                setPosts([...postsRaw])
              }
              if (val && val.label) {
                geocodeByAddress(val.label)
                  .then(results => {
                    const filteredPosts = []
                    const types = ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country']

                    const formatted_address = []

                    const locality = []
                    const administrative_area_level_1 = []
                    const administrative_area_level_2 = []
                    const country = []

                    const postsCopy = [...postsRaw]
                    postsCopy.forEach(post => {
                      let isPostAdded = false
                      results[0].address_components?.forEach(result => {
                        const location = post.location
                        if (location && location.length > 0) {
                          if (location[0].formatted_address === results[0].formatted_address) {
                            if (!isPostAdded) {
                              formatted_address.push(post)
                              isPostAdded = true
                            }
                          }
                          location[0].address_components?.forEach(component => {
                            types.forEach(type => {
                              if (component.types?.includes(type)) {
                                if (result.types?.includes(type)) {
                                  if (
                                    component.long_name?.includes(result.long_name) ||
                                    component.short_name?.includes(result.short_name) ||
                                    component.long_name?.includes(result.short_name) ||
                                    component.short_name?.includes(result.long_name)
                                  ) {
                                    if (!isPostAdded) {
                                      isPostAdded = true
                                      switch (type) {
                                        case 'locality':
                                          return locality.push(post)
                                        case 'administrative_area_level_1':
                                          return administrative_area_level_1.push(post)
                                        case 'administrative_area_level_2':
                                          return administrative_area_level_2.push(post)
                                        case 'country':
                                          return country.push(post)
                                        default: break
                                      }
                                    }
                                  }
                                }
                              }
                            })
                          })
                        }
                      })
                    })
                    formatted_address.forEach(post => filteredPosts.push(post))
                    locality.forEach(post => filteredPosts.push(post))
                    administrative_area_level_1.forEach(post => filteredPosts.push(post))
                    administrative_area_level_2.forEach(post => filteredPosts.push(post))
                    country.forEach(post => filteredPosts.push(post))
                    setAppliedTags([])
                    setAppliedCategory(null)
                    setPostsFilteredByLocation(filteredPosts)
                    setPosts(filteredPosts)
                  })
                  .catch(error => console.error(error))
              }
            }
          }}
        />
        </div>
        <div className="color-bg">
          <h3 className="title">Виберіть тег для пошуку</h3>
          <div className="tags tags-filters">
            {tags.map((tag, index) => (
              <button className={`btn grey-btn tag ${appliedTags?.includes(tag) ? 'included' : ''}`}
                key={index}
                onClick={() => {
                  const filters = [...appliedTags]
                  if (filters?.includes(tag)) {
                    const index = filters.indexOf(tag)
                    if (index > -1) filters.splice(index, 1)
                  } else {filters.push(tag)}
                  setAppliedTags(filters)
                  setPosts(
                    filters.length > 0 ?
                      [...postsFilteredByLocation].filter(post => {
                        let shouldBeDisplayed = false
                        filters.forEach(filter => {if (post.tags?.includes(filter)) shouldBeDisplayed = true})
                        return shouldBeDisplayed
                      })
                      :
                      [...postsFilteredByLocation]
                  )
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
         <div className="color-bg help-block-btn-mobile">
         <h3 className="title">Виберіть</h3>
         <div className="help-block-btn">
           <div>
             <button
               className={
                appliedCategory === 'Asking help' ?
                  "btn grey-btn btn-cube btn-cube-space active" :
                  "btn grey-btn btn-cube btn-cube-space"
               }
               onClick={() => filterByType('Asking help')}>
               Потрібна допомога
             </button>
             <button
               className={
                 appliedCategory === 'Suggesting help' ?
                   "btn grey-btn btn-cube active" :
                   "btn grey-btn btn-cube"
               }
               onClick={() => filterByType('Suggesting help')}>
               Хочу допомогти
             </button>
           </div>
         </div>
       </div>

        <div className="main-content">
          <div className="help-block-btn-desktop">
          <div className="help-block-btn">
            <div>
            <span className="label-space">Виберіть:</span>
            <div>
              <button
                className={
                  appliedCategory === 'Asking help' ?
                    "btn grey-btn btn-cube btn-cube-space active" :
                    "btn grey-btn btn-cube btn-cube-space"
                }
                onClick={() => filterByType('Asking help')}>
                Потрібна допомога
              </button>
              <button
                className={
                  appliedCategory === 'Suggesting help' ?
                    "btn grey-btn btn-cube btn-cube-space active" :
                    "btn grey-btn btn-cube btn-cube-space"
                }
                onClick={() => filterByType('Suggesting help')}>
                Хочу допомогти
              </button>
            </div>
            </div>
            <button className="btn accent-btn add-btn" onClick={() => props.setCreatePopupOpened(true)}>Додати оголошення</button>
          </div>
        </div>
        <div className="posts-list">
          {!posts || !(posts.length > 0) ? <div className="no-results">No results</div> :
          (
            posts?.map((post, index) =>
              (post.report && parseInt(post.report) && parseInt(post.report) >= reportLimit) ?
                null : <Post key={index} data={post}/>
            ))
          }
        </div>
        </div>
      </div>
  )
}

export default PostsList