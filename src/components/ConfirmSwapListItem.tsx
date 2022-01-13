const ConfirmSwapListItem = ({name, value, valueClass}: {name: string, value: string, valueClass?: string}) => {
    return (
        <div id={`swapListItem-${name}`} className="flex justify-between mt-2">
            <div>
                <p className="text-type-300 text-sm">{name}</p>
            </div>
            <div>
                <p id={`swapListValue-${name}`} className={"text-sm " + (valueClass ? valueClass:"text-type-100")}>{value}</p>
            </div>
        </div>
    )
}

export default ConfirmSwapListItem
