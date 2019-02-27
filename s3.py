import boto3
import sys
import os
import ntpath

sts_client = boto3.client('sts')
print sts_client.get_caller_identity()

assume_role = sts_client.assume_role(RoleArn="arn:aws:iam::177083682418:role/S3FullAccessRole", RoleSessionName="Session01")

credentials = assume_role['Credentials']

s3 = boto3.resource(
	's3',
	aws_access_key_id=credentials['AccessKeyId'],
	aws_secret_access_key=credentials['SecretAccessKey'],
	aws_session_token=credentials['SessionToken'],
)

ddb = boto3.resource(
	'dynamodb',
	aws_access_key_id=credentials['AccessKeyId'],
	aws_secret_access_key=credentials['SecretAccessKey'],
	aws_session_token=credentials['SessionToken'],
)

table = ddb.Table('music')

#Get the file upload path
if(len(sys.argv) <= 1):
	path_upload = raw_input('Enter a file/path for upload: ')
elif(len(sys.argv) == 2):
	path_upload = sys.argv[1]
	name_upload = ''
elif(len(sys.argv) == 3):
	path_upload = sys.argv[1]
	name_upload = sys.argv[2]
else:
	exit(1)

##need some helper
def helper_func(path):
	head, tail = os.path.split(path)
	return tail or os.path.basename(head)

#Determine if it is a file
if(os.path.isfile(path_upload)):

	if(len(sys.argv) <= 1):
		name_upload = raw_input('Enter the name of the of file/path (if you leave blank then its the original name): ')
	target_upload = helper_func(path_upload)


	if(name_upload == ''):
		name_artist = raw_input('Enter artist name: ')
		name_album = raw_input('Enter album name: ')
		name_genre = raw_input('Enter genere name: ')

		s3.meta.client.upload_file(str(path_upload), 'choprak-privatebucket01', 'Songs/' + str(target_upload))

		table.put_item(
			Item={
				'genre' : name_genre,
				'artist_album_song' : name_artist + '#' + name_album + '#' + target_upload[:-4],
				'artist' : name_artist
			})
	
	else:
		
		s3.meta.client.upload_file(str(path_upload), 'choprak-privatebucket01', 'Songs/' + str(name_upload))

#Determine if the path is a folder
elif(os.path.isdir(path_upload)):
	name_upload = raw_input('Enter upload name of album and/or artist (if you leave blank then its the original name): ')

	trigger = True;
	for root, dirs, files in os.walk(path_upload):
		if(trigger == True):
			nameOfRoot = helper_func(root)
			trigger = False
		for file in files:
			if(name_upload != ''):
				s3.meta.client.upload_file(str(os.path.join(root, file)), 'choprak-privatebucket01', name_upload + '/' + file)
			else:
				s3.meta.client.upload_file(str(os.path.join(root, file)), 'choprak-privatebucket01', nameOfRoot + '/' + file)	
#State the file or path is invalid
else:
	print('Invalid file/path')