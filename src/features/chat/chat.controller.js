export class ChatController {
  chat = async (req, res) => {
    const { userData } = req.session
    if (!userData) return res.redirect('/')

    res.render('chat', { userData: userData })    
  }
}
