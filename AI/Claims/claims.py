import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score



train_data = pd.read_csv("./train.csv")
test_data = pd.read_csv("./test.csv")


drop_columns = ['_c39', 'policy_number', 'policy_bind_date', 'policy_state', 'insured_zip', 
                'incident_location', 'incident_date', 'incident_state', 'incident_city', 
                'insured_hobbies', 'auto_make', 'auto_model', 'auto_year']
train_data = train_data.drop(columns=drop_columns)

train_data = train_data.replace('?', np.nan)

train_data.isnull().sum()

train_copy = train_data.copy()
columns_to_impute = ['collision_type', 'property_damage', 'police_report_available']


def mark_missing_values(x):
    return 1 if pd.isna(x) else 0



def zeroone(x):
    if x is np.nan:
        return 1
    return 0
for col in columns_to_impute:
    train_copy['imputed'+col] = train_copy[col].apply(zeroone)
    val_to_impute =train_copy[col].value_counts().index[0]
    train_copy[col]=train_copy[col].fillna(val_to_impute)

train_copy.isna().any()


for column in columns_to_impute:
    train_copy[f'imputed_{column}'] = train_copy[column].apply(mark_missing_values)
    most_frequent_value = train_copy[column].mode()[0]
    train_copy[column] = train_copy[column].fillna(most_frequent_value)


train_copy = train_data.copy()
for column in columns_to_impute:
    train_copy[column] = train_copy[column].fillna('Unknown')

categorical_columns = train_copy.select_dtypes(include=['object'])

encoder = OneHotEncoder(drop=None, sparse_output=False)
encoded_data = pd.DataFrame(encoder.fit_transform(categorical_columns))


encoded_columns = encoder.get_feature_names_out(categorical_columns.columns)
encoded_data.columns = encoded_columns


dummy_encoder = OneHotEncoder(drop='first', sparse_output=False)
dummy_encoded_data = pd.DataFrame(dummy_encoder.fit_transform(categorical_columns))
dummy_columns = dummy_encoder.get_feature_names_out(categorical_columns.columns)
dummy_encoded_data.columns = dummy_columns

numerical_columns = train_copy.select_dtypes(exclude=['object']).drop(columns=['fraud_reported'])
target = train_copy['fraud_reported']

scaler = StandardScaler()
scaled_data = pd.DataFrame(scaler.fit_transform(numerical_columns))

scaled_data.columns = numerical_columns.columns

final_encoded_data = pd.concat([encoded_data, scaled_data], axis=1)
final_dummy_data = pd.concat([dummy_encoded_data, scaled_data], axis=1)

def preprocess_data(data):
    columns_to_drop = ['_c39', 'policy_number', 'policy_bind_date', 'policy_state', 'insured_zip', 
                       'incident_location', 'incident_date', 'incident_state', 'incident_city', 
                       'insured_hobbies', 'auto_make', 'auto_model', 'auto_year']
    data = data.drop(columns=columns_to_drop)
    
    # Replace '?' with NaN and impute missing values
    data = data.replace('?', np.nan)
    for column in columns_to_impute:
        most_frequent_value = data[column].mode()[0]
        data[column] = data[column].fillna(most_frequent_value)

    # One-Hot Encoding
    categorical_data = data.select_dtypes(include=['object'])
    encoder = OneHotEncoder(drop=None, sparse_output=False)
    encoded_data = pd.DataFrame(encoder.fit_transform(categorical_data))
    encoded_columns = encoder.get_feature_names_out(categorical_data.columns)
    encoded_data.columns = encoded_columns

    # Standardization of numerical data
    numerical_data = data.select_dtypes(exclude=['object'])
    scaler = StandardScaler()
    scaled_data = pd.DataFrame(scaler.fit_transform(numerical_data))
    scaled_data.columns = numerical_data.columns

    # Combine processed categorical and numerical data
    processed_data = pd.concat([encoded_data, scaled_data], axis=1)
    return processed_data


# Apply the preprocessing to the test data
test_processed = preprocess_data(test_data)


# Split the training data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(final_encoded_data, target, test_size=0.33, random_state=42, stratify=target)


# Initialize and train the Support Vector Machine classifier
svm_classifier = SVC()
predictions = svm_classifier.fit(X_train, y_train).predict(X_test)


# Calculate the accuracy of the model
accuracy = accuracy_score(y_test, predictions)
print(f"Model accuracy: {accuracy:.4f}")

