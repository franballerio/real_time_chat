import { Router } from 'express'; // Use Router from express
import { httpController } from '../controllers/httpController.js'; // Make sure the path is correct and add .js

// This is a "factory function" for your router
export const createHttpRouter = ({ dbModel }) => {
  const httpRouter = Router();
  
  // The controller is now created inside the function, where dbModel exists
  const controller = new httpController({ dbModel });

  httpRouter.get('/', controller.home);
  httpRouter.get('/chat', controller.chat);
  httpRouter.post('/register', controller.register);
  httpRouter.post('/login', controller.login);
  httpRouter.post('/logout', controller.logout);
  httpRouter.get('/users', controller.users); // Changed from delete to get for clarity
  httpRouter.delete('/clear', controller.delete); // More specific path for this action

  return httpRouter;
};