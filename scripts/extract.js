class Extract
{
    static URLInfo()
    {
        try
        {
            let values =  [Extract.cleanedURL(), Extract.#FANumber(), Extract.#courseID(), Extract.#FAID(), Extract.#questionID()];
            let result = {};
            
            G_KEYS.forEach((key, index) =>
            {
                result[key] = values[index];
            })
    
            return result;
        }
        catch (error)
        {
            console.error('Error in URLInfo(): ', error);
            return null;
        }
    }
    
    static cleanedURL()
    {
        let splitUrl = window.location.href.split('/take');
        if (splitUrl.length < 2)
        {
            throw new Error("URL does not contain '/questions'");
        }
    
        return splitUrl[0] + '/take';
    }

    static QnAInfo()
    {
        let QnA =
        {
            questionStatus: undefined,
            question: undefined,
            inputType: undefined,
            choices: undefined,
            prevAnswer: undefined,
        }

        try
        {
            QnA.questionStatus = Extract.#questionStatus();
            QnA.question = Extract.#question();
            QnA.inputType = Extract.#inputType();
            QnA.choices = Extract.#choices(QnA.inputType);
            QnA.prevAnswer = Extract.#prevAnswer(QnA.inputType, QnA.choices);

            console.log('QnA Info: ', QnA);
            return QnA;
        }
        catch (error)
        {
            console.error('Error in QnAInfo(): ', error);
            return null;
        }
    }

    static #prevAnswer(inputType, choices)
    {
        if (inputType === Type.Input.RADIO)
        {
            const checkedButton = Extract.#checkedButton();

            if (checkedButton === -1)
            {
                return -1;
            }

            return choices.choices[checkedButton];
        }
        else if (inputType === Type.Input.TEXT)
        {
            return document.querySelector('.question_input').value;
        }
    }

    static #questionStatus()
    {
        let rawStatus = document.querySelector("span.question_points_holder").textContent;

        if (rawStatus.includes('New Question'))
        {
            return Type.Question.NEW;
        }
        
        let nums = [];
        rawStatus.split(' ')
        .forEach(str =>
        {
            if (!isNaN(Number(str)))
            {
                nums.push(Number(str));
            }
        });

        if (nums.length !== 2)
        {
            throw new Error('Unexpected Question Status: Does not contain exactly 2 numbers');
        }

        if (nums[0] === nums[1])
        {
            return Type.Question.CORRECT;
        }
        else if (nums[0] === 0)
        {
            return Type.Question.WRONG;
        }
        else if (nums[0] < nums[1])
        {
            return Type.Question.PARTIAL;
        }
        else
        {
            throw new Error('Unexpected Question Status');
        }
    }

    static #question()
    {
        return document.querySelector('.question_text.user_content').textContent;
    }

    static #inputType()
    {
        const inputType = document.querySelector('.question_input').type;

        if (inputType !== Type.Input.TEXT && inputType !== Type.Input.RADIO)
        {
            throw new Error('Unexpected input type of: ' + inputType);
        }

        return inputType;
    }

    static #choices(inputType)
    {
        if (inputType === Type.Input.RADIO)
        {
            let options = 
            {
                choices : [],
                isWrongs : [],
            }

            document.querySelectorAll('.answer_label')
            .forEach(div =>
            {
                options.choices.push(div.textContent.slice(9, div.textContent.length - 7)); //indices (0 to 9) and (length - 7 to length) are whitespaces
                options.isWrongs.push(window.getComputedStyle(div).color === Type.Color.RED);
            });

            return options;
        }
        else if (inputType === Type.Input.TEXT)
        {
            return -1;
        }
        
        throw new Error('No choices');
    }

    static #checkedButton()
    {
        let checkedButton = -1;

        const buttons = document.querySelectorAll('.question_input');
        buttons.forEach((button, index) =>
        {
            if (button.checked && checkedButton === -1)
            {
                checkedButton = index;
            }
        });

        return checkedButton;
    }

    static #FANumber() 
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
    
    static #courseID()
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
    
    static #FAID()
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
    
    static #questionID()
    {
        try
        {
            let splitUrl = window.location.href.split('questions/');
            if (splitUrl.length < 2)
            {
                // throw new Error("URL does not contain 'questions/'");
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