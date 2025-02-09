import dotenv from 'dotenv'
dotenv.config()

export default {
  dbURL: process.env.MONGO_URL,
  dbName : process.env.DB_NAME
}

// export default {
//     dbURL: process.env.MONGO_URL || 'mongodb+srv://insta_proj:a1pCpIjdSEVcdsLy@cluster0.i4vkq.mongodb.net/',
//     dbName : process.env.DB_NAME || 'insta_db'
//   }
