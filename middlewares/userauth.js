const islogin= async function(req,res,next){
    try{
        if(req.cookies.user){
            next()
        }else{
            res.render('user/profile', { cookies: "", address: "" })

        }
    }catch(err){
    res.send(err.message)
    }
}

module.exports = {
    islogin
}