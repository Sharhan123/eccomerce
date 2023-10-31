const user = require('../model/schema')

const islogin= async function(req,res,next){
    try{
        if(req.cookies.user){

            const block = await user.findOne({_id:req.cookies.user.id})

            if(block.Blocked===true){
                res.clearCookie('user')
                res.redirect('/')
            }else{
                
                next()
            }
            
        }else{
            res.redirect('/')

        }
    }catch(err){
    res.send(err.message)
    }
}


const islogout = async function(req , res , next){
    try{

        if(req.cookies.user){
            res.redirect('/')
        }else{
            next()
        }


    } catch(err){
        console.log(err);
    }
} 




module.exports = {
    islogin,
    islogout
}