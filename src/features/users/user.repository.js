import DBlocal from 'db-local'

const { Schema } = new DBlocal({ path: './db' })

const User = Schema('User', {
  _id: { type: String, required: true },
  user_name: { type: String, required: true, unique: true},
  email: { type: String, required: true },
  password: { type: String, required: true }
})

export class UserRepository {
  static findOne(query) {
    return User.findOne(query)
  }

  static find(query) {
    return User.find(query)
  }

  static create(user) {
    return User.create(user).save()
  }

  static remove(query) {
    return User.remove(query)
  }
}
