export let baseUrl = null
export let config = null;
export let config1 = null;
export let logoImage = null
export let primaryColor = null
export let secondaryColor = null
export let thirdColor = null
export let selectedColor = null
export let backgroundColor = null
export let profileDateFields = null
export let rowsPerSheet = null;
export let rowEvenColor = null
export let ChannelId = null
export let SecurityBaseUrl = null
export let allowedExtensionsUser = null
export let transactionDateTimeFields = null
export let FixedValues = null

export const getConfig = () => {
    if (!config) {
      throw new Error('Config has not been loaded!');
    }
    return config;
  };

  export const loadConfig = async () => {
    const response = await fetch('./config.json');
    config = await response.json();
    const response1 = await fetch('./masterDocType.json');
    config1 = await response1.json();
    baseUrl = config.baseUrl;
    logoImage=config.logo
    primaryColor=config.primaryColor
    secondaryColor=config.secondaryColor
    thirdColor=config.thirdColor
    selectedColor=config.selectedColor
    backgroundColor=config.backgroundColor
    profileDateFields=config.profileDateFields
    rowEvenColor = config.rowEvenColor
    ChannelId = config.ChannelId
    SecurityBaseUrl = config.SecurityBaseUrl
    allowedExtensionsUser = config.allowedExtensionsUser
    transactionDateTimeFields = config.transactionDateTimeFields
    FixedValues = config1.FixedValues
}