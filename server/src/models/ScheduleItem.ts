import mongoose from 'mongoose'

const ScheduleItemSchema = new mongoose.Schema({
  discipline: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String, required: true },
  subtitle: { type: String }
})

export const ScheduleItem = mongoose.model('ScheduleItem', ScheduleItemSchema)
