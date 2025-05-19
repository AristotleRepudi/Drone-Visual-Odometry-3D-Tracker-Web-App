import cv2
import numpy as np
from zipfile import ZipFile
import os
from pathlib import Path

class VisualOdometry:
    def __init__(self):
        # Increase SIFT features and add contrast threshold
        self.sift = cv2.SIFT_create(nfeatures=5000, contrastThreshold=0.04)
        
        # Improved FLANN matching parameters
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=8)
        search_params = dict(checks=100)
        self.matcher = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Add focal length and principal point for your camera
        focal_length = 1000  # adjust this for your camera
        center_x = 640      # adjust for your image width/2
        center_y = 360      # adjust for your image height/2
        self.camera_matrix = np.array([[focal_length, 0, center_x],
                                     [0, focal_length, center_y],
                                     [0, 0, 1]])
        
        # Add distortion coefficients if known
        self.dist_coeffs = np.array([[-0.28340811], [0.07395907], [0.00019359], [1.76187114e-05]])

    def detect_and_match(self, img1, img2):
        # Enhance images before feature detection
        img1 = cv2.equalizeHist(img1)
        img2 = cv2.equalizeHist(img2)
        
        kp1, des1 = self.sift.detectAndCompute(img1, None)
        kp2, des2 = self.sift.detectAndCompute(img2, None)
        
        matches = self.matcher.knnMatch(des1, des2, k=2)
        
        # More strict ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.6 * n.distance:  # Stricter ratio
                good_matches.append(m)
        
        pts1 = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 2)
        pts2 = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 2)
        
        # Filter outliers using fundamental matrix
        if len(pts1) > 8:
            F, mask = cv2.findFundamentalMat(pts1, pts2, cv2.FM_RANSAC, 1, 0.99)
            pts1 = pts1[mask.ravel() == 1]
            pts2 = pts2[mask.ravel() == 1]
        
        return pts1, pts2, good_matches

    def estimate_pose(self, pts1, pts2):
        # Normalize points
        pts1_norm = cv2.undistortPoints(pts1.reshape(-1, 1, 2), self.camera_matrix, self.dist_coeffs)
        pts2_norm = cv2.undistortPoints(pts2.reshape(-1, 1, 2), self.camera_matrix, self.dist_coeffs)
        
        E, mask = cv2.findEssentialMat(
            pts1_norm, pts2_norm,
            focal=1.0, pp=(0., 0.),
            method=cv2.RANSAC,
            prob=0.999,
            threshold=0.001
        )
        
        _, R, t, mask = cv2.recoverPose(E, pts1_norm, pts2_norm, mask=mask)
        
        # Adaptive scale based on median scene depth
        scale = self.estimate_scale(pts1, pts2, R, t)
        t = t * scale
        
        return R, t

    def estimate_scale(self, pts1, pts2, R, t):
        # Triangulate points
        P1 = np.hstack((np.eye(3), np.zeros((3, 1))))
        P2 = np.hstack((R, t))
        
        points4D = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
        points3D = points4D / points4D[3]
        
        # Estimate scale from median depth
        depths = points3D[2]
        median_depth = np.median(depths)
        scale = 1.0 / median_depth if median_depth != 0 else 5.0
        return min(max(scale, 0.1), 10.0)  # Limit scale between 0.1 and 10

async def process_image_sequence(zip_path: Path, temp_dir: Path) -> list:
    vo = VisualOdometry()
    trajectory = [(0, 0, 0)]  # Starting position
    current_position = np.zeros((3, 1))
    current_rotation = np.eye(3)
    
    # Extract images from zip
    with ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
    
    # Get sorted list of image files
    image_files = sorted([f for f in os.listdir(temp_dir) if f.endswith(('.jpg', '.png'))])
    
    if len(image_files) < 2:
        raise ValueError("Need at least 2 images for trajectory calculation")

    prev_img = None
    for img_file in image_files:
        img = cv2.imread(str(temp_dir / img_file), cv2.IMREAD_GRAYSCALE)
        
        if prev_img is not None:
            pts1, pts2, matches = vo.detect_and_match(prev_img, img)
            
            if len(matches) < 8:  # Minimum points needed for essential matrix
                continue
                
            R, t = vo.estimate_pose(pts1, pts2)
            
            # Update position and rotation
            current_rotation = current_rotation @ R
            current_position = current_position + current_rotation @ t
            
            # Add new position to trajectory
            trajectory.append((
                float(current_position[0]),
                float(current_position[1]),
                float(current_position[2])
            ))
            
        prev_img = img.copy()  # Make a copy to ensure we don't modify the original
    
    if len(trajectory) < 2:
        raise ValueError("Could not calculate trajectory. Check image quality and sequence.")
    
    return trajectory