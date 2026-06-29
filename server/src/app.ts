import cors from 'cors'
import express, { Request, Response } from 'express'


import eventsRouter from './routes/events'

import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors())
app.use(express.json())

// observabilidad de requests
app.use(requestLogger)

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

app.use('/events', eventsRouter)

app.use(errorHandler)

export default app