import 'dotenv/config'
import app from './app'

const port = process.env.PORT ?? '8080'

if (require.main === module) {
  app.listen(parseInt(port), () => {
    console.log(`Server listening on :${port}`)
  })
}