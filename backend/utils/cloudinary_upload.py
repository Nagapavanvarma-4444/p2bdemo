"""
Cloudinary upload helper for PLAN 2 BUILD.
Handles image and file uploads to Cloudinary CDN.
"""

import cloudinary
import cloudinary.uploader
from config import Config


# Initialize Cloudinary
cloudinary.config(
    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
    api_key=Config.CLOUDINARY_API_KEY,
    api_secret=Config.CLOUDINARY_API_SECRET
)


def upload_image(file, folder='plan2build'):
    """
    Upload an image to Cloudinary.
    Falls back to local storage if Cloudinary credentials are not configured.
    """
    import os
    import uuid
    from werkzeug.utils import secure_filename

    # If Cloudinary is configured, try uploading there first
    if Config.CLOUDINARY_CLOUD_NAME and Config.CLOUDINARY_CLOUD_NAME != 'placeholder':
        try:
            result = cloudinary.uploader.upload(
                file,
                folder=folder,
                resource_type='image',
                quality='auto',
                fetch_format='auto'
            )
            return {
                'url': result['secure_url'],
                'public_id': result['public_id']
            }
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            # fall through to local storage if it fails

    # LOCAL STORAGE FALLBACK
    try:
        # Create unique filename
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        
        # Determine path (relative to backend/)
        # Using folder name to organize (replacing / with os.sep)
        subfolder = folder.replace('plan2build/', '').replace('/', os.sep)
        upload_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', subfolder)
        os.makedirs(upload_path, exist_ok=True)
        
        full_path = os.path.join(upload_path, unique_name)
        
        # Reset file pointer and save
        file.seek(0)
        file.save(full_path)
        
        # Return local API URL
        web_path = f"/api/uploads/{subfolder.replace(os.sep, '/')}/{unique_name}"
        return {
            'url': web_path,
            'public_id': f"local_{unique_name}"
        }
    except Exception as e:
        print(f"Local storage fallback error: {e}")
        # Final fallback - UI Avatar
        return {
            'url': f"https://ui-avatars.com/api/?name=User&background=random&size=256",
            'public_id': 'error_fallback'
        }


def upload_file(file, folder='plan2build/files'):
    """
    Upload any file (PDF, etc.) to Cloudinary.
    
    Args:
        file: File object from request
        folder: Cloudinary folder name
    
    Returns:
        dict: {url, public_id} on success, None on failure
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type='raw'
        )
        return {
            'url': result['secure_url'],
            'public_id': result['public_id']
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None


def delete_file(public_id, resource_type='image'):
    """
    Delete a file from Cloudinary.
    
    Args:
        public_id: Cloudinary public ID of the file
        resource_type: 'image' or 'raw'
    
    Returns:
        bool: True on success, False on failure
    """
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return True
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        return False


def validate_file_extension(filename, allowed_extensions):
    """
    Validate file extension against allowed types.
    
    Args:
        filename: Original filename
        allowed_extensions: Set of allowed extensions (e.g., {'pdf', 'jpg'})
    
    Returns:
        bool: True if extension is allowed
    """
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions
