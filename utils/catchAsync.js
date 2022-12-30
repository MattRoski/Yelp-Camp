module.exports = func => {
    return (req, res, next) =>{
        func(req, res, next).catch(next);
    }
}
//returns a function that accepts a function and then it executes that function
//catches any errors and passes it to next if there is an error
//use this to wrap our async functions

//pass in func..returns a new function that has func executed and then catches any erros and passes them to next
