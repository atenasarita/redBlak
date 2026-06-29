import express from 'express'
import cors from 'cors'
import { json } from 'body-parser'
import eventsRouter from './routes/events'

const app = express()
app.use(cors())
app.use(json())

app.get('/health', (_req, res) => res.status(200).send('OK'))
app.use('/events', eventsRouter)

export default app