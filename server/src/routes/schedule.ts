import { Router } from 'express'
import { ScheduleItem } from '../models/ScheduleItem'
import { Event } from '../models/Event'
import { Closure } from '../models/Closure'
import { checkJwt, requireRole } from '../middleware/auth'

const router = Router()

// Get all schedule data - public, powers the /schedule page for all visitors
router.get('/', async (_req, res) => {
  try {
    const [scheduleItems, upcomingEvents, upcomingClosures] = await Promise.all([
      ScheduleItem.find(),
      Event.find(),
      Closure.find()
    ])
    res.json({ scheduleItems, upcomingEvents, upcomingClosures })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schedule' })
  }
})

// Schedule Items CRUD - admin only
router.post('/schedule-items', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    console.log('Creating schedule item:', req.body)
    const item = new ScheduleItem(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (error) {
    console.error('Failed to create schedule item:', error)
    res.status(500).json({ message: 'Failed to create schedule item', error: (error as Error).message })
  }
})

router.put('/schedule-items/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const item = await ScheduleItem.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Schedule item not found' })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update schedule item' })
  }
})

router.delete('/schedule-items/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const item = await ScheduleItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Schedule item not found' })
    res.json({ message: 'Schedule item deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete schedule item' })
  }
})

// Events CRUD - admin only
router.post('/events', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    console.log('Creating event:', req.body)
    const event = new Event(req.body)
    await event.save()
    res.status(201).json(event)
  } catch (error) {
    console.error('Failed to create event:', error)
    res.status(500).json({ message: 'Failed to create event', error: (error as Error).message })
  }
})

router.put('/events/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update event' })
  }
})

router.delete('/events/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json({ message: 'Event deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event' })
  }
})

// Closures CRUD - admin only
router.post('/closures', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    console.log('Creating closure:', req.body)
    const closure = new Closure(req.body)
    await closure.save()
    res.status(201).json(closure)
  } catch (error) {
    console.error('Failed to create closure:', error)
    res.status(500).json({ message: 'Failed to create closure', error: (error as Error).message })
  }
})

router.put('/closures/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const closure = await Closure.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!closure) return res.status(404).json({ message: 'Closure not found' })
    res.json(closure)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update closure' })
  }
})

router.delete('/closures/:id', checkJwt, requireRole('club-admin'), async (req, res) => {
  try {
    const closure = await Closure.findByIdAndDelete(req.params.id)
    if (!closure) return res.status(404).json({ message: 'Closure not found' })
    res.json({ message: 'Closure deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete closure' })
  }
})

export default router
