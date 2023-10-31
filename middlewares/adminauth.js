const islogin= async function(req,res,next){
try{
    if(req.cookies.admin){
        next()
    }else{
        res.redirect('/getadmin')
    }
} catch(err){
    res.send(err)
}
}

module.exports={
    islogin
}