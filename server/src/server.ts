import 'dotenv/config'
import app from './app'

const port = process.env.PORT ?? '8080'

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(port), () => {
    console.log(`Server listening on :${port}`)
  })
}