class Extract
{
    static getURLInfo()
    {
        try
        {
            let values =  [Extract.getCleanedURL(), Extract.getFANumber(), Extract.getCourseID(), Extract.getFAID(), Extract.getQuestionID()];
            let result = {};
            
            KEYS.forEach((key, index) =>
            {
                result[key] = values[index];
            })
    
            return result;
        }
        catch (error)
        {
            console.error('Error in getURLInfo(): ', error);
            return null;
        }
    }
    
    static getFANumber() 
    {
        const header = document.querySelector('header.quiz-header');
        if (!header)
        {
            throw new Error("'header.quiz-header' not found");
        }
    
        const h1 = header.querySelector('h1');
        if (!h1)
        {
            throw new Error("'h1' not found");
        }
    
        const FANumber = h1.textContent;
        if (!FANumber)
        {
            throw new Error("'FANumber' not found or empty");
        }
    
        return Utils.sanitizeForURL(FANumber);
    }
    
    static getCleanedURL()
    {
        let splitUrl = window.location.href.split('/take');
        if (splitUrl.length < 2)
        {
            throw new Error("URL does not contain '/questions'");
        }
    
        return splitUrl[0] + '/take';
    }
    
    static getCourseID()
    {
        let splitUrl = window.location.href.split('courses/');
        if (splitUrl.length < 2)
        {
            throw new Error("URL does not contain 'courses/'");
        }
    
        splitUrl = splitUrl[1].split('/quizzes');
        if (splitUrl.length < 2)
        {
            throw new Error("URL does not contain '/quizzes'");
        }
    
        return splitUrl[0];
    }
    
    static getFAID()
    {
        let splitURL = window.location.href.split('quizzes/');
        if (splitURL.length < 2)
        {
            throw new Error("URL does not contain 'quizzes/'");
        }
        
        splitURL = splitURL[1].split('/');
        if (splitURL.length < 2)
        {
            throw new Error("URL does not contain '/'");
        }
    
        return splitURL[0];
    }
    
    static getQuestionID()
    {
        try
        {
            let splitUrl = window.location.href.split('questions/');
            if (splitUrl.length < 2)
            {
                throw new Error("URL does not contain 'questions/'");
            }
    
            return splitUrl[1];
        }
        catch (error)
        {
            console.error("Error in getting getQuestionsID(): ", error);
            return null;
        }
    }
}