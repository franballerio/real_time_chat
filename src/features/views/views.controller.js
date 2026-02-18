export class ViewsController {
  home = async (req, res) => {
    const { userData } = req.session
    if (!userData) return res.render('index')
  
    res.redirect('/chat')
  }
  
  chat = async (req, res) => {
    const { userData } = req.session
    if (!userData) return res.redirect('/')
    res.render('chat', { userInfo: userData })    
  }
}