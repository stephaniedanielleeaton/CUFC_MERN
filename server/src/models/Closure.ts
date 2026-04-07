import mongoose from 'mongoose'

const ClosureSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  dates: { type: String, required: true }
})

export const Closure = mongoose.model('Closure', ClosureSchema)
