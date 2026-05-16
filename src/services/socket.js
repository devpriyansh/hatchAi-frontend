import { io } from 'socket.io-client'

export const socket = io(
   'https://hatchai-backend.onrender.com'
)