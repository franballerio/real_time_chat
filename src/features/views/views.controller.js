export class ViewsController {
  home = async (req, res) => {
    const { userData } = req.session
    if ( !userData.user_id || !userData.user_name ) return res.render('index')
  
    res.redirect('/chat')
  }
  
  chat = async (req, res) => {
    const { userData } = req.session
    if ( !userData.user_id || !userData.user_name ) return res.redirect('/')
    res.render('chat', { userData: userData })    
  }
}