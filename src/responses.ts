type APIResponse = {
    success: boolean,
    data: any
}

const error = (message?: any): APIResponse => {
    return {
        success: false,
        data: {
            error: message
        }
    }
}

const success = (data?: object): APIResponse => {
    return {
        success: true,
        data
    }
}

export { error, success }