import {
    Image,
    Keyboard,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from "react-native";
  
  import { InputFieldProps } from "@/types/type";
  
  const InputField = ({
    label,
    icon,
    secureTextEntry = false,
    labelStyle,
    containerStyle,
    inputStyle,
    iconStyle,
    className,
    placeholder,
    ...props
  }: InputFieldProps) => {



    return (
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
           <View>
            <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
              {label}
            </Text>
            <View
              className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500  ${containerStyle}`}
            >
              {icon && (
                <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
              )}
              <TextInput
                className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
                secureTextEntry={secureTextEntry}
                placeholder={placeholder}
                placeholderTextColor={"#858585"}
                {...props}
              />
            </View>
            </View>
          </TouchableWithoutFeedback>
         
    );
  };
  
  export default InputField;