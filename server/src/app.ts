import express from 'express'
import cors from 'cors'
import { json } from 'body-parser'

import eventsRouter from './routes/events'

import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors())
app.use(json())

// observabilidad de requests
app.use(requestLogger)

app.get('/health', (_req, res) => {
  res.status(200).send('OK')
})

app.use('/events', eventsRouter)

app.use(errorHandler)

export default app