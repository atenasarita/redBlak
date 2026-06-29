import React, {useEffect, useState} from 'react'

type Event = {
  id?: number
  level: string
  message: string
  timestamp: string
}

export default function EventTable(){
  const [events, setEvents] = useState<Event[]>([])

  async function load(){
    try{
      const res = await fetch('/events')
      const json = await res.json()
      setEvents(json)
    }catch(e){
      console.error(e)
    }
  }

  useEffect(()=>{
    load()
    const i = setInterval(load, 5000)
    return ()=>clearInterval(i)
  },[])

  return (
    <div>
      <table>
        <thead>
          <tr><th>When</th><th>Level</th><th>Message</th></tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id ?? Math.random()}>
              <td>{new Date(ev.timestamp).toLocaleString()}</td>
              <td>{ev.level}</td>
              <td>{ev.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
